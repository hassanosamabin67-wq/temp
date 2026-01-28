'use client'
import { Search, Briefcase } from 'lucide-react';
import './style.css';
import AnimatedSection from '@/Components/UIComponents/AnimatedSection';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Pagination } from 'antd';
import { services } from './utils/constant/services';

function ServicePageComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingService, setLoadingService] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 6;
  const router = useRouter();

  const filteredServices = services.filter((service) => {
    const query = searchTerm.toLowerCase();

    return (
      service.title.toLowerCase().includes(query) ||
      service.description.toLowerCase().includes(query) ||
      service.details.toLowerCase().includes(query)
    );
  });

  const handleCategoryClick = (categoryName: string) => {
    setLoadingService(categoryName);
    const slug = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')
    router.push(`/services/${slug}`)
  };

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;

  const paginatedServices = filteredServices.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <section className="services">
      <div className="services-background">
        <div className="services-blob-1"></div>
        <div className="services-blob-2"></div>
        <div className="services-blob-3"></div>
      </div>

      <div className="services-container">
        <AnimatedSection>
          <div className="services-header">
            <h2 className="services-title">
              Our <span className="services-title-gradient">Services</span>
            </h2>
            <p className="services-description">
              Discover our comprehensive range of creative services across multiple categories. From online events to visual arts, find the perfect service for your needs.
            </p>

            <div className="services-search">
              <Search className="services-search-icon" />
              <input
                type="text"
                placeholder="Search services, categories, or specialties..."
                className="services-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </AnimatedSection>

        <div className="services-grid">
          {paginatedServices.length === 0 ? (
            <p className="services-no-results">
              No services found for "{searchTerm}"
            </p>
          ) : paginatedServices.map((service, index) => (
            <AnimatedSection key={service.id} delay={index * 0.1}>
              <div className={`service-card service-card-${service.color}`}>
                <div className="service-card-overlay"></div>

                <div className="service-card-image-wrapper">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="service-card-image"
                  />
                  <div className="service-card-image-gradient"></div>
                </div>

                <div className="service-card-content">
                  <div className="service-icon-wrapper">
                    <service.icon className="service-icon" />
                  </div>

                  <h3 className="service-title">{service.title}</h3>
                  <p className="service-description">{service.description}</p>

                  <div className="service-details">
                    <p className="service-details-label">Includes:</p>
                    <p className="service-details-text">{service.details}</p>
                  </div>

                  <Button icon={<Briefcase className="service-button-icon" />} className="service-button" onClick={() => handleCategoryClick(service.title)} loading={loadingService === service.title}>
                    Learn More
                  </Button>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
        {filteredServices.length > PAGE_SIZE && (
          <div className="services-pagination">
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={filteredServices.length}
              onChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              showSizeChanger={false}
              align="center"
            />
          </div>
        )}
      </div>
    </section>
  );
}

export default ServicePageComponent