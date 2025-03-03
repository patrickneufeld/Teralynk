// /Users/patrick/Projects/Teralynk/frontend/src/components/ErrorPage.jsx

import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";

const ErrorPage = ({ errorCode = 404, errorMessage = "Page Not Found" }) => {
    const isCriticalError = errorCode >= 500;

    return (
        <div className="p-6 flex justify-center items-center min-h-screen bg-gray-100">
            <Card className="max-w-lg shadow-lg bg-white p-6 text-center">
                <CardContent>
                    <h1 className="text-4xl font-bold text-red-500">Error {errorCode}</h1>
                    <p className="text-gray-600 text-lg mt-2">{errorMessage}</p>

                    <div className="mt-4">
                        <Link to="/">
                            <Button className="bg-blue-500 hover:bg-blue-600 text-white mr-2">
                                Back to Home
                            </Button>
                        </Link>

                        {isCriticalError && (
                            <a href="mailto:support@example.com">
                                <Button className="bg-red-500 hover:bg-red-600 text-white">
                                    Contact Support
                                </Button>
                            </a>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ErrorPage;
