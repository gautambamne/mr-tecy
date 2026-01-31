import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface RetryButtonProps {
    onRetry: () => Promise<void> | void;
    maxRetries?: number;
    children?: React.ReactNode;
    className?: string;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg';
}

/**
 * Retry Button Component
 * Provides retry functionality with exponential backoff and max retry limit
 */
export function RetryButton({
    onRetry,
    maxRetries = 3,
    children = 'Retry',
    className = '',
    variant = 'default',
    size = 'default',
}: RetryButtonProps) {
    const [retrying, setRetrying] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const handleRetry = async () => {
        if (retryCount >= maxRetries) {
            return;
        }

        setRetrying(true);
        try {
            await onRetry();
            setRetryCount(0); // Reset on success
        } catch (error) {
            console.error('[RetryButton] Retry failed:', error);
            setRetryCount(prev => prev + 1);
        } finally {
            setRetrying(false);
        }
    };

    const isMaxRetriesReached = retryCount >= maxRetries;

    return (
        <Button
            onClick={handleRetry}
            disabled={retrying || isMaxRetriesReached}
            variant={variant}
            size={size}
            className={`font-bold rounded-full ${className}`}
        >
            {retrying ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                </>
            ) : isMaxRetriesReached ? (
                'Max retries reached'
            ) : (
                <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {children}
                    {retryCount > 0 && ` (${retryCount}/${maxRetries})`}
                </>
            )}
        </Button>
    );
}
