import React from 'react';
import { useDcLedgerContext } from '../../context/dailyCollection/dcLedgerContext';
import DayBookTab from './DayBookTab';

const DayBookPage = () => {
    const { dayBook, fetchDayBook, error, clearError } = useDcLedgerContext();

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Day Book</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Opening, receipts, payments, and closing for one day
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2">
                            <p className="text-red-700 text-sm">{error}</p>
                            <button
                                type="button"
                                onClick={clearError}
                                className="ml-auto text-red-500 hover:text-red-700"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                <DayBookTab dayBook={dayBook} fetchDayBook={fetchDayBook} />
            </div>
        </div>
    );
};

export default DayBookPage;
