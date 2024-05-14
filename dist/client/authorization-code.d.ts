import { OAuth2Client } from '../client';
import { OAuth2Token } from '../token';
type GetAuthorizeUrlParams = {
    /**
     * Where to redirect the user back to after authentication.
     */
    redirectUri: string;
    /**
     * The 'state' is a string that can be sent to the authentication server,
     * and back to the redirectUri.
     */
    state?: string;
    /**
     * Code verifier for PKCE support. If you used this in the redirect
     * to the authorization endpoint, you also need to use this again
     * when getting the access_token on the token endpoint.
     */
    codeVerifier?: string;
    /**
     * List of scopes.
     */
    scope?: string[];
    /**
     * The resource the client intends to access.
     *
     * This is defined in RFC 8707.
     */
    resource?: string[] | string;
    /**
     * Any parameters listed here will be added to the query string for the authorization server endpoint.
     */
    extraParams?: Record<string, string>;
};
type ValidateResponseResult = {
    /**
     * The authorization code. This code should be used to obtain an access token.
     */
    code: string;
    /**
     * List of scopes that the client requested.
     */
    scope?: string[];
};
type GetTokenParams = {
    code: string;
    redirectUri: string;
    state?: string;
    codeVerifier?: string;
    extraParams?: Record<string, string>;
    /**
     * The resource the client intends to access.
     *
     * @see https://datatracker.ietf.org/doc/html/rfc8707
     */
    resource?: string[] | string;
};
export declare class OAuth2AuthorizationCodeClient {
    client: OAuth2Client;
    constructor(client: OAuth2Client);
    /**
     * Returns the URi that the user should open in a browser to initiate the
     * authorization_code flow.
     */
    getAuthorizeUri(params: GetAuthorizeUrlParams): Promise<string>;
    getTokenFromCodeRedirect(url: string | URL, params: Omit<GetTokenParams, 'code'>): Promise<OAuth2Token>;
    /**
     * After the user redirected back from the authorization endpoint, the
     * url will contain a 'code' and other information.
     *
     * This function takes the url and validate the response. If the user
     * redirected back with an error, an error will be thrown.
     */
    validateResponse(url: string | URL, params: {
        state?: string;
    }): Promise<ValidateResponseResult>;
    /**
     * Receives an OAuth2 token using 'authorization_code' grant
     */
    getToken(params: GetTokenParams): Promise<OAuth2Token>;
}
export declare function generateCodeVerifier(): Promise<string>;
export declare function getCodeChallenge(codeVerifier: string): Promise<['plain' | 'S256', string]>;
export {};
