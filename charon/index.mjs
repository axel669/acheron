//  This function is for confirming the token provided is valid and generating
//  the JWT that will be used for auth on other routes.

//  We use the twitch token verify route instead of the JWT because we need
//  to get extra user info from the twitch API anyway.
//  Set the stage variables "secret" and "clientID" to verify the token and
//  generate signed JWTs.
//  Use the Client ID from Twitch for verification.
//  Pretty much any string can be used as a secret,
//  but anything that is easily guessed will be less secure.

import fetch from "node-fetch"
import cookie from "cookie"
import jwt from "jsonwebtoken"

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Method": "*",
    "Content-Type": "application/json",
}

const deny = {
    statusCode: 401,
    headers: {
        ...headers,
        "Set-Cookie": cookie.serialize("obol", "nope", { httpOnly: true })
    },
    body: JSON.stringify(false)
}

const GET = async (options) => {
    const {
        url,
        params = {},
        headers = {}
    } = options
    //  URLSearchParams are standard in node and browser, and its better than
    //  pretty much all of the old ways of generating the query strings.
    const urlParams = new URLSearchParams(params)
    const targetURL = `${url}?${urlParams.toString()}`

    const response = await fetch(targetURL, { headers })

    //  Returning an error beacuse I like Rust's error handling, and fetch
    //  doesn't throw on errors so try/catch wouldn't help.
    if (response.status !== 200) {
        return new Error("")
    }
    return await response.json()
}
const Err = (obj) => obj instanceof Error

export const handler = async (event) => {
    //  I use post data to send the access token because I that's what I wrote
    //  first and it works. There isn't a specific reason it has to be POST
    //  instead of GET.
    const {key} = JSON.parse(event.body)
    const {clientID, secret} = event.stageVariables

    //  Verify the token with Twitch.
    const tokenInfo = await GET({
        url: "https://id.twitch.tv/oauth2/validate",
        headers: { "Authorization": `Bearer ${key}` }
    })

    //  If the token provided isn't for the same application to auth against
    //  then reject the token
    if (Err(tokenInfo) || tokenInfo.client_id !== clientID) {
        return deny
    }

    //  Get some info about the user that is commonly used on the front end.
    const userInfo = await GET({
        url: "https://api.twitch.tv/helix/channels",
        params: { broadcaster_id: tokenInfo.user_id },
        headers: {
            "Authorization": `Bearer ${key}`,
            "Client-ID": clientID,
        }
    })

    //  Sign a JWT with the secret set in the stage variables.
    //  8 days is set as the duration for the key because the number of seconds
    //  in 8 days starts with 69.
    const token = jwt.sign(
        {
            clientID,
            userID: tokenInfo.user_id,
            username: tokenInfo.login,
            displayName: userInfo.data[0].broadcaster_name,
            token: key,
        },
        secret,
        { expiresIn: "8d" }
    )

    //  Very important that we set the cookie to be http only so that if someone
    //  is able to inject code into the front end, they will still be unable
    //  to read the auth cookie and tamper with it or steal it.
    return {
        statusCode: 200,
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
