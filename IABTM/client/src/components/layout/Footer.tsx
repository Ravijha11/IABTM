import React from 'react';
import { Instagram, Facebook, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="mt-10 text-gray-800 py-8">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-5 gap-8">
                <div className="footer-section">
                    <img src="https://c.animaapp.com/m8nag6vuQg1Dnq/img/frame-217.svg" alt="IABTM Logo" className="footer-logo w-32 mb-4" />
                    <p className='text-gray-500' >Copyright © IABTM 2025</p>
                </div> 
                <div className="footer-section">
                    <h4 className="text-lg font-semibold mb-2">Get to know us</h4>
                    <ul>
                        <li><a href="/about" className="hover:text-gray-600">About</a></li>
                        <li><a href="/blog" className="hover:text-gray-600">Blog</a></li>
                        <li><a href="/contact" className="hover:text-gray-600">Contact us</a></li>
                    </ul>
                </div>
                <div className="footer-section">
                    <h4 className="text-lg font-semibold mb-2">IABTM platform</h4>
                    <ul>
                        <li><a href="/how-it-works" className="hover:text-gray-600">How it works?</a></li>
                        <li><a href="/podcast" className="hover:text-gray-600">IABTM Podcast</a></li>
                        <li><a href="/experts" className="hover:text-gray-600">Experts</a></li>
                        <li><a href="/3605" className="hover:text-gray-600">3605</a></li>
                        <li><a href="/shop" className="hover:text-gray-600">Shop</a></li>
                    </ul>
                </div>
                <div className="footer-section">
                    <h4 className="text-lg font-semibold mb-2">Legal</h4>
                    <ul>
                        <li><a href="/cookie-notice" className="hover:text-gray-600">Cookie notice</a></li>
                        <li><a href="/privacy-policy" className="hover:text-gray-600">Privacy policy</a></li>
                        <li><a href="/terms-of-service" className="hover:text-gray-600">Terms of service</a></li>
                    </ul>
                </div>
                <div className="footer-section">
                <h4 className="text-lg font-semibold mb-2">Socials</h4>
                    <ul>
                        <li><a href="https://instagram.com" className="hover:text-gray-600 flex items-center"><Instagram className="w-4 h-4 mr-2" />Instagram</a></li>
                        <li><a href="https://facebook.com" className="hover:text-gray-600 flex items-center"><Facebook className="w-4 h-4 mr-2" />Facebook</a></li>
                        <li><a href="https://twitter.com" className="hover:text-gray-600 flex items-center"><Twitter className="w-4 h-4 mr-2" />Twitter</a></li>
                    </ul>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
