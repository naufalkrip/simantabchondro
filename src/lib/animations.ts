import type { Variants } from 'framer-motion';

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
};

export const fadeUpVariants: Variants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } }
};

export const staggerContainer: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
};

export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', bounce: 0, duration: 0.4 } },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } }
};

export const sidebarSlide: Variants = {
  open: { x: 0, transition: { type: 'spring', bounce: 0, duration: 0.35 } },
  closed: { x: '-100%', transition: { type: 'spring', bounce: 0, duration: 0.35 } }
};

export const dropdownVariants: Variants = {
  initial: { opacity: 0, y: -4, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.15, ease: 'easeOut' } },
  exit: { opacity: 0, y: -4, scale: 0.96, transition: { duration: 0.1, ease: 'easeIn' } }
};

export const heroVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } }
};

export const scaleOnHover = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { type: 'spring', stiffness: 400, damping: 17 }
};

export const cardHover = {
  whileHover: { y: -4, transition: { duration: 0.2 } }
};
