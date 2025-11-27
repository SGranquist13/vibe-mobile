
import axios from 'axios';
import { encodeBase64 } from "../encryption/base64";
import { getServerUrl } from "@/sync/serverConfig";

interface AuthRequestStatus {
    status: 'not_found' | 'pending' | 'authorized';
    supportsV2: boolean;
}

export async function authApprove(token: string, publicKey: Uint8Array, answerV1: Uint8Array, answerV2: Uint8Array) {
    const API_ENDPOINT = getServerUrl();
    const publicKeyBase64 = encodeBase64(publicKey);
    
    try {
        // First, check the auth request status
        const statusResponse = await axios.get<AuthRequestStatus>(
            `${API_ENDPOINT}/v1/auth/request/status`,
            {
                params: {
                    publicKey: publicKeyBase64
                }
            }
        );
        
        const { status, supportsV2 } = statusResponse.data;
        
        // Handle different status cases
        if (status === 'not_found') {
            // Auth request doesn't exist - this could mean:
            // 1. The CLI hasn't created the request yet (timing issue)
            // 2. The public key doesn't match
            // 3. The request expired
            throw new Error('Authentication request not found. Make sure the CLI is running `vibe auth login` and try again.');
        }
        
        if (status === 'authorized') {
            // Already authorized - this is actually success, not an error
            console.log('Auth request already authorized');
            return;
        }
        
        // Handle pending status
        if (status === 'pending') {
            const response = await axios.post(`${API_ENDPOINT}/v1/auth/response`, {
                publicKey: publicKeyBase64,
                response: supportsV2 ? encodeBase64(answerV2) : encodeBase64(answerV1)
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            
            if (response.status !== 200) {
                throw new Error(`Server returned status ${response.status}`);
            }
        } else {
            throw new Error(`Unexpected auth request status: ${status}`);
        }
    } catch (error: any) {
        // Re-throw with more context if it's an axios error
        if (axios.isAxiosError(error)) {
            if (error.response) {
                // Server responded with error status
                const status = error.response.status;
                const message = error.response.data?.error || error.message;
                throw new Error(`Server error (${status}): ${message}`);
            } else if (error.request) {
                // Request was made but no response received
                throw new Error(`Cannot connect to server at ${API_ENDPOINT}. Make sure the server is running.`);
            } else {
                // Something else happened
                throw new Error(`Request failed: ${error.message}`);
            }
        }
        // Re-throw the error as-is if it's already a regular Error
        throw error;
    }
}