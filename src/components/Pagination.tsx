import React from 'react';
import './Pagination.css';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    onItemsPerPageChange: (itemsPerPage: number) => void;
    itemsPerPageOptions: number[];
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    onItemsPerPageChange,
    itemsPerPageOptions,
}) => {
    return (
        <div className="pagination-custom mt-4">
            <div className="items-per-page">
                <label htmlFor="itemsPerPage" className="mr-2">Items par page:</label>
                <select
                    id="itemsPerPage"
                    value={itemsPerPage}
                    onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                    className="border border-gray-300 rounded-md"
                >
                    {itemsPerPageOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            </div>
            <div className="pagination-buttons">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    Précédent
                </button>
                <span>{currentPage} / {totalPages}</span>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Suivant
                </button>
            </div>
        </div>
    );
};

export default Pagination;