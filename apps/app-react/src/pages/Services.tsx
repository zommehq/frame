interface Service {
  description: string;
  features: string[];
  id: number;
  name: string;
}

function Services() {
  const services: Service[] = [
    {
      description: 'Custom software development tailored to your needs',
      features: ['Full-stack development', 'Cloud integration', 'Agile methodology'],
      id: 1,
      name: 'Custom Development',
    },
    {
      description: 'Expert consulting services for your technology stack',
      features: ['Architecture review', 'Performance optimization', 'Best practices'],
      id: 2,
      name: 'Technical Consulting',
    },
    {
      description: 'Ongoing support and maintenance for your applications',
      features: ['24/7 monitoring', 'Bug fixes', 'Feature updates'],
      id: 3,
      name: 'Support & Maintenance',
    },
  ];

  return (
    <div>
      <h2>Services</h2>
      <p>Explore our professional services offerings.</p>

      <div style={{ marginTop: '20px', display: 'grid', gap: '20px' }}>
        {services.map((service) => (
          <div
            key={service.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '5px',
              padding: '20px',
            }}
          >
            <h3 style={{ margin: '0 0 10px 0' }}>{service.name}</h3>
            <p style={{ color: '#666', margin: '0 0 15px 0' }}>{service.description}</p>

            <div>
              <h4 style={{ fontSize: '14px', margin: '0 0 10px 0' }}>Key Features:</h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {service.features.map((feature, index) => (
                  <li key={index} style={{ marginBottom: '5px' }}>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <button
              style={{
                background: '#0066cc',
                border: 'none',
                borderRadius: '5px',
                color: 'white',
                cursor: 'pointer',
                marginTop: '15px',
                padding: '8px 16px',
              }}
              type="button"
              onClick={() => alert(`Requesting information about ${service.name}`)}
            >
              Learn More
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Services;
