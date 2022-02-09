//  This function is turned into a Lambda Authorizor and checks to see if
//  if the request is authenticated against the current API.

//  In API Gateway, use the stage variable "secret" to set a secret for
//  signing/verifying the JWTs. Don't need to check the client-id here
//  because it's checked when creating the JWT in charon.

import cookie from "cookie"
import jwt from "jsonwebtoken"

//  these are here so the return values are easier to understand
const deny = {
    isAuthorized: false
}
const allow = {
    isAuthorized: true
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

    return allow
}
