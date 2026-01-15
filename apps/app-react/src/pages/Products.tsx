import { useState } from 'react';

interface Product {
  description: string;
  id: number;
  name: string;
  price: number;
}

function Products() {
  const [products] = useState<Product[]>([
    {
      description: 'High-performance laptop',
      id: 1,
      name: 'Laptop Pro',
      price: 1299.99,
    },
    {
      description: 'Wireless noise-canceling headphones',
      id: 2,
      name: 'Headphones X',
      price: 299.99,
    },
    {
      description: 'Ergonomic mechanical keyboard',
      id: 3,
      name: 'Keyboard Elite',
      price: 149.99,
    },
    {
      description: 'Precision gaming mouse',
      id: 4,
      name: 'Mouse Pro',
      price: 79.99,
    },
  ]);

  return (
    <div>
      <h2>Products</h2>
      <p>Browse our catalog of products.</p>

      <div style={{ marginTop: '20px', display: 'grid', gap: '15px' }}>
        {products.map((product) => (
          <div
            key={product.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '5px',
              padding: '15px',
            }}
          >
            <h3 style={{ margin: '0 0 10px 0' }}>{product.name}</h3>
            <p style={{ color: '#666', margin: '0 0 10px 0' }}>{product.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#0066cc' }}>
                ${product.price.toFixed(2)}
              </span>
              <button
                style={{
                  background: '#0066cc',
                  border: 'none',
                  borderRadius: '5px',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '8px 16px',
                }}
                type="button"
                onClick={() => alert(`Added ${product.name} to cart`)}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Products;
