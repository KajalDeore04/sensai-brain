import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import React from 'react';

const Header = () => {
    return (
        <div className='flex items-center justify-between p-5 shadow-md'>
       <Link href={'/dashboard'}> <h1 className='bg-gradient-to-r from-blue-200 to-indigo-500 inline-block text-transparent bg-clip-text font-bold text-3xl '>Brain AI</h1></Link>
{/* user profile logo */}
            <UserButton />
        </div>
    );
}

export default Header;
