import { createSigner, createVerifier } from "fast-jwt";

const createApplicationToken = async (payload: any) => {
    const signToken = createSigner({ key: process.env.MAINTEX_SECRET_KEY as string });
    return signToken(payload);
}

// Verifier
const verifyApplicationToken = async (token: string) => {
    const verifyToken = createVerifier({ key: process.env.MAINTEX_SECRET_KEY as string });
    return verifyToken(token);
}


export {
    createApplicationToken,
    verifyApplicationToken,
}