import React from 'react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-purple-50">
        <h1 className="text-black text-4xl font-bold mb-6">About Azad Bazaar</h1>
        <p className='text-gray-800 text-lg space-y-4'>
            Welcome to Azad Bazaar, a thoughtfully built online marketplace where uniqueness meets affordability. We handpick products that are practical, innovative, and truly worth your money — because we believe everyone deserves better, without overpaying for it.
        </p>
        <p className='text-gray-800 text-lg space-y-4 mt-4'>
            Azad Bazaar was born after many rounds of brainstorming and discussion. Every stakeholder instantly connected with the name because it represents our core belief: freedom.
        </p>
        <h2 className="text-black text-2xl font-semibold mt-8 mb-4">Why “Azad Bazaar”?</h2>
        <p className='text-gray-800 text-lg space-y-4 mt-4'>
            “Azad” means freedom, and that’s exactly what we want to deliver to our customers —
        </p>
        <ul className='list-disc list-inside text-gray-800 text-lg space-y-4 mt-4'>
            <li>Freedom from overpriced products that drain your wallet.</li>
            <li>Freedom to choose from a curated selection of items that offer real value.</li>
            <li>Freedom to shop with confidence, knowing you’re getting the best bang for your buck.</li>
        </ul>
        <p className='text-gray-800 text-lg space-y-4 mt-4'>
            At Azad Bazaar, we’re more than just an online store — we’re a community that values smart shopping and quality living. Join us on this journey to redefine the way you shop and experience true freedom in every purchase.
        </p>
        <>
            <h2 className="text-black text-2xl font-semibold mt-8 mb-4">What We Offer</h2>
            <p className="text-gray-800 text-lg">
                From everyday essentials to unique lifestyle gadgets, our catalog has something for every home and every person. Whether it’s kitchen essentials, home improvement items, cleaning tools, electronics, or smart accessories, we bring you a curated range of products like bottle cleaners, kitchen mats, soap dispensers, massage guns, nut choppers, oil dispensers, and so much more.
            </p>
            <p className="text-gray-800 text-lg mt-4">
                We constantly explore new, interesting, and trending products to ensure our customers always find something fresh and useful.
            </p>

            <h2 className="text-black text-2xl font-semibold mt-8 mb-4">Our Promise</h2>
            <ul className="list-disc list-inside text-gray-800 text-lg mt-4 space-y-2">
                <li><span className="font-semibold">Quality You Can Trust</span> – Every product is selected with care.</li>
                <li><span className="font-semibold">Reasonable Prices</span> – Great value without compromise.</li>
                <li><span className="font-semibold">Wide Variety</span> – A marketplace full of choices.</li>
                <li><span className="font-semibold">Customer Commitment</span> – Your satisfaction is at the center of our decisions.</li>
            </ul>

            <p className="text-gray-800 text-lg mt-4">
                At Azad Bazaar, we aim to make your shopping experience simple, exciting, and reliable. We’re here to help you discover better products, better value, and a better way to shop — with complete freedom.
            </p>

            <p className="text-gray-800 text-lg mt-4 font-medium">
                Thank you for being part of Azad Bazaar. Your trust inspires us to keep growing, improving, and bringing you the products you truly deserve.
            </p>
        </>
    </div>
  );
}