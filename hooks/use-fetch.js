import { useState } from "react";
import { toast } from "sonner";

const useFetch = (cb) => {
    const [data, setData] = useState(undefined);
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState(null);

    const fn = async (...args) => {
        setLoading(true);
        setError(null);
        setData(undefined); // Reset data on new fetch

        try {
            const response = await cb(...args);
            setData(response);
            setError(null);
            return response; // Return the response for immediate use
        } catch (err) {
            const errorMessage = err.message || "An unknown error occurred";
            setError(errorMessage);
            toast.error(errorMessage);
            throw err; // Re-throw the error for try/catch handling
        } finally {
            setLoading(false);
        }
    }

    return { 
        data, 
        loading, 
        error, 
        fn, 
        setData,
        reset: () => {
            setData(undefined);
            setError(null);
            setLoading(null);
        }
    };
}

export default useFetch;