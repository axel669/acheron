//  This function is for providing a logout route. It just erases the auth
//  cookie.

//  This is the date format cookies expect for expiration dates.
const expire = new Date(1970, 0, 1).toGMTString()

exports.handler = async (event) => {
    return {
        statusCode: 200,
        headers: {
            "Set-Cookie": `obol=; Expires=${expire}; HttpOnly; Secure; SameSite=None`
        },
        body: JSON.stringify(true),
    }
}
