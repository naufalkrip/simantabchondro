import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { fadeUpVariants } from '../../lib/animations';

interface CardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <motion.div 
      variants={fadeUpVariants}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-20px" }}
      className={clsx('bg-white rounded-md shadow-sm border border-gray-100 p-3', className)} 
      {...props}
    >
      {children}
    </motion.div>
  );
};
