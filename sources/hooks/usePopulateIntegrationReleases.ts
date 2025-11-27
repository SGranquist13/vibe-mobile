import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { populateIntegrationReleases } from '@/sync/apiIntegrationReleases';
import { log } from '@/log';

/**
 * Hook to populate integration releases on mount
 * Only runs once per session
 */
export function usePopulateIntegrationReleases() {
    const { credentials } = useAuth();
    const [hasPopulated, setHasPopulated] = useState(false);
    const [isPopulating, setIsPopulating] = useState(false);

    useEffect(() => {
        if (!credentials || hasPopulated || isPopulating) {
            return;
        }

        const populate = async () => {
            setIsPopulating(true);
            try {
                log.log('🔄 Populating integration releases...');
                const result = await populateIntegrationReleases(credentials, 30); // Last 30 days
                log.log(`✅ Populated ${result.created} integration releases`);
                setHasPopulated(true);
            } catch (error) {
                console.error('Failed to populate integration releases:', error);
                // Don't set hasPopulated on error so we can retry
            } finally {
                setIsPopulating(false);
            }
        };

        populate();
    }, [credentials, hasPopulated, isPopulating]);

    return { hasPopulated, isPopulating };
}




