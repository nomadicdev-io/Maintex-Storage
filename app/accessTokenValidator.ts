const accessTokenValidator = async ({ headers, jwt }: { headers: any, jwt: any }) => {
    const accessToken = headers['x-maintex-access-token']
    if (!accessToken) {
        throw {
            status: false,
            code: 'ACCESS_TOKEN_MISSING',
            statusCode: 401,
            message: 'Access token is required',
            description: 'The access token is required. Please provide a valid access token.',
        }
    }
    const verify = await jwt.verify(accessToken)
    if(!verify) {
        throw {
            status: false,
            code: 'ACCESS_TOKEN_INVALID',
            statusCode: 401,
            message: 'Access token is invalid',
            description: 'The access token is invalid. Please provide a valid access token.',
        }
    }
}

export default accessTokenValidator