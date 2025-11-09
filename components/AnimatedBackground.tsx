import React, { useRef, useEffect } from 'react';

const PARTICLE_COUNT = 25;
const COLORS = ['#DAB88B', '#C88EA7', '#FFF4E3', '#F4EAD5'];

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    opacity: number;
    type: 'circle' | 'plus';
}

const AnimatedBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    // FIX: Initialize useRef with null to provide an initial value.
    const animationFrameIdRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const createParticles = () => {
            particlesRef.current = [];
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                particlesRef.current.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    radius: Math.random() * 2 + 1,
                    color: COLORS[Math.floor(Math.random() * COLORS.length)],
                    opacity: Math.random() * 0.5 + 0.1,
                    type: Math.random() > 0.3 ? 'circle' : 'plus'
                });
            }
        };

        const drawParticle = (particle: Particle) => {
            if (!ctx) return;
            ctx.beginPath();
            ctx.globalAlpha = particle.opacity;
            
            if (particle.type === 'circle') {
                ctx.fillStyle = particle.color;
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fill();
            } else { // plus
                ctx.lineWidth = particle.radius / 1.5;
                ctx.strokeStyle = particle.color;
                // Horizontal line
                ctx.moveTo(particle.x - particle.radius, particle.y);
                ctx.lineTo(particle.x + particle.radius, particle.y);
                // Vertical line
                ctx.moveTo(particle.x, particle.y - particle.radius);
                ctx.lineTo(particle.x, particle.y + particle.radius);
                ctx.stroke();
            }
        };

        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);

            particlesRef.current.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < -p.radius * 2) p.x = width + p.radius * 2;
                if (p.x > width + p.radius * 2) p.x = -p.radius * 2;
                if (p.y < -p.radius * 2) p.y = height + p.radius * 2;
                if (p.y > height + p.radius * 2) p.y = -p.radius * 2;

                drawParticle(p);
            });

            animationFrameIdRef.current = requestAnimationFrame(animate);
        };
        
        const handleResize = () => {
             width = window.innerWidth;
             height = window.innerHeight;
             if (canvas) {
                canvas.width = width;
                canvas.height = height;
             }
             createParticles();
        };

        createParticles();
        animate();
        
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if(animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
            }}
            aria-hidden="true"
        />
    );
};

export default AnimatedBackground;