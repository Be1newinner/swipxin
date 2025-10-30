import * as jwt from "jsonwebtoken";

export function decodeToken(token: string) {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) throw new Error("JWT_SECRET is required!");
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
}

// Generate JWT token
export const generateAccessToken = (userId: string) => {
    const JWT_SECRET = process.env.JWT_SECRET;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const JWT_EXPIRES_IN: any = process.env.JWT_EXPIRES_IN || "7d";
    if (!JWT_SECRET) throw new Error("JWT_SECRET is required!");
    return jwt.sign(
        { sub: userId },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};