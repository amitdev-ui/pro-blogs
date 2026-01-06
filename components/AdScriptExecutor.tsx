"use client";

import { useEffect } from "react";

export default function AdScriptExecutor() {
  useEffect(() => {
    // Only run on client side after hydration
    if (typeof window === 'undefined') return;

    const executeAdScripts = () => {
      try {
        const adContainers = document.querySelectorAll('.ad-content-wrapper');
        
        adContainers.forEach((container) => {
          const scripts = Array.from(container.querySelectorAll('script:not([data-executed])')).filter(
            (el): el is HTMLScriptElement => el instanceof HTMLScriptElement
          );
          
          scripts.forEach((script) => {
            try {
              // Create a new script element
              const newScript = document.createElement('script');
              
              // Copy attributes (except data-executed)
              for (let i = 0; i < script.attributes.length; i++) {
                const attr = script.attributes[i];
                if (attr.name !== 'data-executed') {
                  newScript.setAttribute(attr.name, attr.value);
                }
              }
              
              // Set content or src
              if (script.innerHTML) {
                newScript.innerHTML = script.innerHTML;
              } else if (script.textContent) {
                newScript.textContent = script.textContent;
              }
              
              if (script.src) {
                newScript.src = script.src;
              }
              
              // Mark original as executed
              script.setAttribute('data-executed', 'true');
              
              // Insert new script and remove old one
              if (script.parentNode) {
                script.parentNode.insertBefore(newScript, script);
                script.parentNode.removeChild(script);
              }
            } catch (err) {
              console.warn('Error executing ad script:', err);
            }
          });
        });
      } catch (error) {
        console.warn('Error in executeAdScripts:', error);
      }
    };

    // Wait for hydration to complete
    const timer1 = setTimeout(executeAdScripts, 100);
    const timer2 = setTimeout(executeAdScripts, 500);
    const timer3 = setTimeout(executeAdScripts, 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return null;
}

