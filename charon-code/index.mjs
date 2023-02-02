import fetch from "node-fetch"
import cookie from "cookie"
import jwt from "jsonwebtoken"

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Method": "*",
    "Content-Type": "application/json",
    "Location": "http://localhost:4745",
}

const deny = {
    statusCode: 401,
    headers: {
        ...headers,
        "Set-Cookie": cookie.serialize("obol", "nope", { httpOnly: true })
    },
    body: JSON.stringify(false)
}

const REQ = async (options) => {
    const {
        url,
        params = {},
        headers = {},
        method = "GET",
    } = options
    const urlParams = new URLSearchParams(params)
    const targetURL = `${url}?${urlParams.toString()}`

    const response = await fetch(targetURL, { headers, method })

    console.log(response.status)

    if (response.status !== 200) {
        console.log(await response.text())
        return new Error("")
    }
    return await response.json()
}
const Err = (obj) => obj instanceof Error

export const handler = async (event) => {
    const { code } = event.queryStringParameters
    const {
        clientID,
        twitchSecret,
        secret,
        redir,
        appToken
    } = event.stageVariables

    const tokenInfo = await REQ({
        url: "https://id.twitch.tv/oauth2/token",
        params: {
            "client_id": clientID,
            "client_secret": twitchSecret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redir,
        },
        headers: { "Authorization": `Bearer ${appToken}` },
        method: "POST",
    })

    if (Err(tokenInfo) === true) {
        return deny
    }

    const id = jwt.decode(tokenInfo.id_token)

    const userInfo = await REQ({
        url: "https://api.twitch.tv/helix/channels",
        params: { broadcaster_id: id.sub },
        headers: {
            "Authorization": `Bearer ${tokenInfo.access_token}`,
            "Client-ID": clientID,
        }
    })

    const token = jwt.sign(
        {
            clientID,
            userID: id.sub,
            username: userInfo.data[0].broadcaster_login,
            displayName: userInfo.data[0].broadcaster_name,
            token: {
                access: tokenInfo.access_token,
                refresh: tokenInfo.refresh_token,
            },
        },
        secret,
        { expiresIn: "8d" }
    )

    return {
        statusCode: 302,
        headers: {
            ...headers,
            "Set-Cookie": cookie.serialize(
                "obol",
                token,
                {
                    httpOnly: true,
                    expires: new Date(
                        Date.now() + 691200000
                    ),
                    secure: true,
                    sameSite: "none",
                }
            ),
        },
        body: JSON.stringify(true)
    }
}
