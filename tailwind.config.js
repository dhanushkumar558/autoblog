/** @type {import('tailwindcss').Config} */
export default {
  content: ['./public/**/*.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#374151',
            h2: {
              fontSize: '1.5rem',
              fontWeight: '700',
              marginTop: '2rem',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid #e5e7eb',
            },
            h3: {
              fontSize: '1.25rem',
              fontWeight: '600',
              marginTop: '1.5rem',
              marginBottom: '0.75rem',
            },
            p: {
              marginTop: '1rem',
              marginBottom: '1rem',
              lineHeight: '1.75',
            },
            ul: {
              listStyleType: 'disc',
              paddingLeft: '1.5rem',
              marginTop: '1rem',
              marginBottom: '1rem',
            },
            ol: {
              listStyleType: 'decimal',
              paddingLeft: '1.5rem',
              marginTop: '1rem',
              marginBottom: '1rem',
            },
            li: {
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
            },
            a: {
              color: '#2563eb',
              textDecoration: 'underline',
            },
            blockquote: {
              borderLeftColor: '#2563eb',
              fontStyle: 'italic',
              color: '#4b5563',
            },
            code: {
              backgroundColor: '#f3f4f6',
              padding: '0.125rem 0.25rem',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              fontWeight: '400',
            },
            pre: {
              backgroundColor: '#1f2937',
              color: '#f9fafb',
              padding: '1rem',
              borderRadius: '0.5rem',
              overflowX: 'auto',
            },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
