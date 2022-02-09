//  This function is just for getting the token info back out for the front
//  end to use since the cookies are shared between host domains and not
//  accessible by the front end code.

import cookie from "cookie"
import jwt from "jsonwebtoken"

//  Might not need these with http apis? used to use these for CORS
const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Method": "*",
    "Content-Type": "application/json",
}

export const handler = async (event) => {
    //  For some reason the cookie header is removed when sending to Lambda.
    //  The event still has the cookies in an array, so we just join it back
    //  together for the parser.
    const cookies = cookie.parse(
        event.cookies.join("; ")
    )

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(
            jwt.decode(cookies.obol)
        )
    }
}
