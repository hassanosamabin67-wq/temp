'use client'
import React, { useState } from 'react';
import { Spin } from 'antd';
import { Search, Grid3x3, List, Heart } from 'lucide-react';
import VisionaryCard from './VisionaryCard';
import { menuData } from '@/utils/services';
import { useMyNetwork } from '@/hooks/useMyNetwork';
import { useAppSelector } from '@/store';
import './style.css';

const ExploreVisionaries = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>(undefined);
    const [currentPage, setCurrentPage] = useState(1);
    const visionariesPerPage = 9;
    const profile = useAppSelector((state) => state.auth);
    const { favoriteVisionaries, addVisionaryLoading, toggleFavorite, allVisionaries, dataLoading } = useMyNetwork(profile.profileId!)

    const filteredVisionaries = allVisionaries.filter((visionary: any) => {
        const fullName = `${visionary.firstName || ''} ${visionary.lastName || ''}`.toLowerCase().trim();
        const matchesSearch = fullName.includes(searchTerm.toLowerCase().trim());
        const matchesCategory = selectedCategory === 'all' || visionary.category === selectedCategory;
        const matchesSubcategory = !selectedSubcategory || visionary.subcategory === selectedSubcategory;
        return matchesSearch && matchesCategory && matchesSubcategory;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredVisionaries.length / visionariesPerPage);
    const paginatedVisionaries = filteredVisionaries.slice(
        (currentPage - 1) * visionariesPerPage,
        currentPage * visionariesPerPage
    );

    if (dataLoading) {
        return (
            <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Spin size='large' />
            </div>
        )
    }

    const categories = ['All', ...menuData.map(cat => cat.category)];

    return (
        <div className="visionaries-page">
            {/* Hero Section */}
            <div className="visionaries-hero">
                <div className="visionaries-hero-background" />
                <div className="visionaries-hero-blobs">
                    <div className="visionaries-hero-blob-1" />
                    <div className="visionaries-hero-blob-2" />
                </div>
                <div className="visionaries-hero-content">
                    <h1 className="visionaries-hero-title">Explore Visionaries</h1>
                    <p className="visionaries-hero-subtitle">
                        Discover talented professionals ready to bring your vision to life. Connect with experts
                        across design, development, marketing, and more.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="visionaries-main">
                <div className="visionaries-container">
                    {/* Search and Filters */}
                    <div className="visionaries-controls">
                        <div className="visionaries-search-wrapper">
                            <div className="visionaries-search-bar">
                                <Search className="visionaries-search-icon" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by name, title, or skills..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="visionaries-search-input"
                                />
                            </div>
                        </div>

                        <div className="visionaries-filter-row">
                            <div className="visionaries-categories">
                                <button
                                    onClick={() => {
                                        setSelectedCategory('all');
                                        setSelectedSubcategory(undefined);
                                    }}
                                    className={`visionaries-category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                                >
                                    All
                                </button>
                                {menuData.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => {
                                            setSelectedCategory(category.category);
                                            setSelectedSubcategory(undefined);
                                        }}
                                        className={`visionaries-category-btn ${selectedCategory === category.category ? 'active' : ''}`}
                                    >
                                        {category.category}
                                    </button>
                                ))}
                            </div>

                            <div className="visionaries-view-toggle">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`visionaries-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                >
                                    <Grid3x3 size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`visionaries-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                >
                                    <List size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results Count */}
                    <div className="visionaries-results-info">
                        <p className="visionaries-results-text">
                            Showing {filteredVisionaries.length} of {allVisionaries.length} {filteredVisionaries.length !== 1 ? 'visionaries' : 'visionary'}
                        </p>
                    </div>

                    {/* Visionaries Grid */}
                    {filteredVisionaries && filteredVisionaries.length > 0 ? (
                        <>
                        <div className={`visionaries-grid ${viewMode}`}>
                            {paginatedVisionaries.map((visionary: any, index: number) => {
                                const isFavorite = favoriteVisionaries.includes(visionary.userId);
                                return (
                                    <VisionaryCard 
                                        key={visionary.userId} 
                                        visionary={visionary} 
                                        isFavorite={isFavorite} 
                                        addFavorite={toggleFavorite} 
                                        addLoading={addVisionaryLoading}
                                        viewMode={viewMode}
                                    />
                                );
                            })}
                        </div>
                        {/* Pagination Controls */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32, gap: 8 }}>
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #ccc', background: currentPage === 1 ? '#f3f3f3' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                            >
                                Previous
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: 4,
                                        border: '1px solid #ccc',
                                        background: currentPage === i + 1 ? '#3b82f6' : '#fff',
                                        color: currentPage === i + 1 ? '#fff' : '#333',
                                        fontWeight: currentPage === i + 1 ? 700 : 400,
                                        cursor: 'pointer',
                                        margin: '0 2px',
                                    }}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #ccc', background: currentPage === totalPages ? '#f3f3f3' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                            >
                                Next
                            </button>
                        </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '48px 0' }}>
                            <div style={{
                                width: '96px',
                                height: '96px',
                                margin: '0 auto 16px',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Search size={48} style={{ color: '#bfbfbf' }} />
                            </div>
                            <h3 style={{ marginBottom: '8px', fontSize: '1.5rem', fontWeight: 700 }}>
                                No visionaries found
                            </h3>
                            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                                Try adjusting your search criteria or filters
                            </p>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('all');
                                    setSelectedSubcategory(undefined);
                                    setCurrentPage(1);
                                }}
                                className="visionary-profile-btn"
                                style={{ maxWidth: '200px', margin: '0 auto' }}
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExploreVisionaries;