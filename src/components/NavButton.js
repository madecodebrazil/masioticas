"use client";
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

const NavButton = ({ icon, href }) => (
    <Link href={href} passHref>
        <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex justify-center items-center"
        >
            <Image src={icon} width={30} height={30} alt="nav-icon" />
        </motion.div>
    </Link>
);

export default NavButton;
