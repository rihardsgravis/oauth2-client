"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCodeChallenge = exports.generateCodeVerifier = exports.OAuth2AuthorizationCodeClient = void 0;
const error_1 = require("../error");
class OAuth2AuthorizationCodeClient {
    constructor(client) {
        this.client = client;
    }
    /**
     * Returns the URi that the user should open in a browser to initiate the
     * authorization_code flow.
     */
    async getAuthorizeUri(params) {
        const [codeChallenge, authorizationEndpoint] = await Promise.all([
            params.codeVerifier ? getCodeChallenge(params.codeVerifier) : undefined,
            this.client.getEndpoint('authorizationEndpoint')
        ]);
        const query = new URLSearchParams({
            client_id: this.client.settings.clientId,
            response_type: 'code',
            redirect_uri: params.redirectUri,
        });
        if (codeChallenge) {
            query.set('code_challenge_method', codeChallenge[0]);
            query.set('code_challenge', codeChallenge[1]);
        }
        if (params.state) {
            query.set('state', params.state);
        }
        if (params.scope) {
            query.set('scope', params.scope.join(' '));
        }
        if (params.resource)
            for (const resource of [].concat(params.resource)) {
                query.append('resource', resource);
            }
        if (params.extraParams)
            for (const [k, v] of Object.entries(params.extraParams)) {
                if (query.has(k))
                    throw new Error(`Property in extraParams would overwrite standard property: ${k}`);
                query.set(k, v);
            }
        return authorizationEndpoint + '?' + query.toString();
    }
    async getTokenFromCodeRedirect(url, params) {
        const disallowed = ['codeVerifier', 'redirectUri', 'resource', 'state'];
        if ((params === null || params === void 0 ? void 0 : params.extraParams) && Object.keys(params.extraParams).filter((key) => disallowed.includes(key)).length > 0) {
            throw new Error(`The following extraParams are disallowed: '${disallowed.join("', '")}'`);
        }
        const { code } = await this.validateResponse(url, {
            state: params.state
        });
        return this.getToken({
            code,
            redirectUri: params.redirectUri,
            codeVerifier: params.codeVerifier,
            extraParams: params.extraParams
        });
    }
    /**
     * After the user redirected back from the authorization endpoint, the
     * url will contain a 'code' and other information.
     *
     * This function takes the url and validate the response. If the user
     * redirected back with an error, an error will be thrown.
     */
    async validateResponse(url, params) {
        var _a;
        const queryParams = new URL(url).searchParams;
        if (queryParams.has('error')) {
            throw new error_1.OAuth2Error((_a = queryParams.get('error_description')) !== null && _a !== void 0 ? _a : 'OAuth2 error', queryParams.get('error'), 0);
        }
        if (!queryParams.has('code'))
            throw new Error(`The url did not contain a code parameter ${url}`);
        if (params.state && params.state !== queryParams.get('state')) {
            throw new Error(`The "state" parameter in the url did not match the expected value of ${params.state}`);
        }
        return {
            code: queryParams.get('code'),
            scope: queryParams.has('scope') ? queryParams.get('scope').split(' ') : undefined,
        };
    }
    /**
     * Receives an OAuth2 token using 'authorization_code' grant
     */
    async getToken(params) {
        const body = {
            grant_type: 'authorization_code',
            code: params.code,
            redirect_uri: params.redirectUri,
            code_verifier: params.codeVerifier,
            resource: params.resource,
            ...params === null || params === void 0 ? void 0 : params.extraParams,
        };
        return this.client.tokenResponseToOAuth2Token(this.client.request('tokenEndpoint', body));
    }
}
exports.OAuth2AuthorizationCodeClient = OAuth2AuthorizationCodeClient;
async function generateCodeVerifier() {
    const webCrypto = getWebCrypto();
    if (webCrypto) {
        const arr = new Uint8Array(32);
        webCrypto.getRandomValues(arr);
        return base64Url(arr);
    }
    else {
        // Old node doesn't have 'webcrypto', so this is a fallback
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const nodeCrypto = require('crypto');
        return new Promise((res, rej) => {
            nodeCrypto.randomBytes(32, (err, buf) => {
                if (err)
                    rej(err);
                res(buf.toString('base64url'));
            });
        });
    }
}
exports.generateCodeVerifier = generateCodeVerifier;
async function getCodeChallenge(codeVerifier) {
    const webCrypto = getWebCrypto();
    if (webCrypto === null || webCrypto === void 0 ? void 0 : webCrypto.subtle) {
        return ['S256', base64Url(await webCrypto.subtle.digest('SHA-256', stringToBuffer(codeVerifier)))];
    }
    else {
        // Node 14.x fallback
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const nodeCrypto = require('crypto');
        const hash = nodeCrypto.createHash('sha256');
        hash.update(stringToBuffer(codeVerifier));
        return ['S256', hash.digest('base64url')];
    }
}
exports.getCodeChallenge = getCodeChallenge;
function getWebCrypto() {
    // Browsers
    if ((typeof window !== 'undefined' && window.crypto)) {
        return window.crypto;
    }
    // Web workers possibly
    if ((typeof self !== 'undefined' && self.crypto)) {
        return self.crypto;
    }
    // Node
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');
    if (crypto.webcrypto) {
        return crypto.webcrypto;
    }
    return null;
}
function stringToBuffer(input) {
    const buf = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i++) {
        buf[i] = input.charCodeAt(i) & 0xFF;
    }
    return buf;
}
function base64Url(buf) {
    return (btoa(String.fromCharCode(...new Uint8Array(buf)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, ''));
}
//# sourceMappingURL=authorization-code.js.map