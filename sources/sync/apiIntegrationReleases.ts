import { AuthCredentials } from '@/auth/tokenStorage';
import { backoff } from '@/utils/time';
import { getServerUrl } from './serverConfig';
import { log } from '@/log';

export interface IntegrationRelease {
    integration: string;
    version: string;
    message: string;
    type: 'update' | 'issue' | 'deprecation' | 'feature';
    releaseUrl?: string;
    publishedAt?: number;
}

export interface PopulateReleasesResponse {
    created: number;
    releases: Array<{
        integration: string;
        version: string;
    }>;
}

/**
 * Populate recent integration releases for the authenticated user
 */
export async function populateIntegrationReleases(
    credentials: AuthCredentials,
    days?: number
): Promise<PopulateReleasesResponse> {
    const API_ENDPOINT = getServerUrl();
    
    return await backoff(async () => {
        const params = new URLSearchParams();
        if (days) params.set('days', days.toString());
        
        const url = `${API_ENDPOINT}/v1/integration-releases/populate${params.toString() ? `?${params}` : ''}`;
        log.log(`🔄 Populating integration releases: ${url}`);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${credentials.token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to populate integration releases: ${response.status}`);
        }

        const data = await response.json() as PopulateReleasesResponse;
        return data;
    });
}

/**
 * Get available integration releases (without creating feed items)
 */
export async function getIntegrationReleases(
    credentials: AuthCredentials
): Promise<IntegrationRelease[]> {
    const API_ENDPOINT = getServerUrl();
    
    return await backoff(async () => {
        const url = `${API_ENDPOINT}/v1/integration-releases`;
        log.log(`📋 Fetching integration releases: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${credentials.token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch integration releases: ${response.status}`);
        }

        const data = await response.json() as { releases: IntegrationRelease[] };
        return data.releases;
    });
}




