//  This function is turned into a Lambda Authorizor and checks to see if
//  if the request is authenticated against the current API.

//  In API Gateway, use the stage variable "secret" to set a secret for
//  signing/verifying the JWTs.

//  When creating the Lambda Authorizor is AWS, make to use
//  $request.header.Cookie as the identity source (it's not plural).

import cookie from "cookie"
import jwt from "jsonwebtoken"

//  these are here so the return values are easier to understand
const deny = {
    isAuthorized: false
}

//  I really like how Rust does error handling, so I made my own way to do it
//  for fun (and I think it looks nicer than try/catch)
const safe = f => {
    try {
        return f()
    }
    catch (err) {
        return err
    }
}
const Err = (obj) => obj instanceof Error

export const handler = async (event) => {
    const cookies = cookie.parse(event.headers.cookie)

    //  if no cookie, deny access
    if (cookies.obol === undefined) {
        return deny
    }

    const token = safe(
        () => jwt.verify(cookies.obol, event.stageVariables.secret)
    )
    if (Err(token)) {
        return deny
    }
    if (token.clientID !== event.stageVariables.clientID) {
        return deny
    }

    return {
        isAuthorized: true,
        context: {
            userID: token.userID,
        }
    }
}
