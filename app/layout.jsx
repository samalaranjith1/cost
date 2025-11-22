import './globals.css';
import { Source_Sans_3 } from 'next/font/google';
import ToastContainer from '@/components/ToastContainer';

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-source-sans'
});

export const metadata = {
  title: 'Flavour Heaven - Restaurant Management',
  description: 'Manage your restaurant with ease',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className={sourceSans.className}>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
