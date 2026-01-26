import { useEffect, useState, useRef } from 'react';

const CHARACTERS = '0123456789ABCDZ!@#$%^&*';

const ShuffleText = ({
    text = '',
    className = '',
    shuffleDuration = 50,
    revealDelay = 200,
    initialDelay = 5,
    shuffleOnHover = true,
}) => {
    const [displayText, setDisplayText] = useState(text);
    const intervalRef = useRef(null);
    const timeoutRef = useRef(null);

    function getRandomChar() {
        return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    }

    const runAnimation = (delay = 0) => {
        // Clear any existing timers
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            let iteration = 0;
            const originalText = text;

            intervalRef.current = setInterval(() => {
                setDisplayText(
                    originalText
                        .split('')
                        .map((char, index) => {
                            if (index < iteration) {
                                return originalText[index];
                            }
                            return getRandomChar();
                        })
                        .join('')
                );

                if (iteration >= originalText.length) {
                    clearInterval(intervalRef.current);
                    setDisplayText(originalText); // Ensure final text is correct
                }

                iteration += 1 / 3;
            }, shuffleDuration);
        }, delay);
    };

    useEffect(() => {
        runAnimation(initialDelay);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [text]);

    const handleMouseEnter = () => {
        if (shuffleOnHover) {
            runAnimation(0);
        }
    };

    return (
        <span
            className={className}
            onMouseEnter={handleMouseEnter}
            style={{ cursor: shuffleOnHover ? 'pointer' : 'inherit' }}
        >
            {displayText}
        </span>
    );
};

export default ShuffleText;
