"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

export const AnimatedSection = ({ children, className, ...props }) => {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({ opacity: 1, y: 0 });
  }, [controls]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={controls}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={className}
      {...props}
    >
      {children}
    </motion.section>
  );
};
