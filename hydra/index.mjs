import cookie from "cookie"
import jwt from "jsonwebtoken"

export default function hydra(event) {
    const cookies = cookie.parse(
        event.cookies.join("; ")
    )

    return jwt.decode(cookies.obol)
}
