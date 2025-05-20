import '@/styles/globals.css';
import Layout from '@/components/Layout';
// Apply global Chart.js styling
import '@/utils/chartDefaults';

function MyApp({ Component, pageProps }) {
  return (
    <Layout title={Component.displayName || Component.name || 'SPORTFIVE'}>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp; 