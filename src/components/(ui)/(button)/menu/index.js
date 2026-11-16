import React, { useState, useRef, useEffect, cloneElement } from 'react';

const menuPositionClasses = {
    bottom: 'top-full left-0 -translate-y-[10px]',
    top: 'bottom-full left-0 translate-y-[10px]',
    left: 'right-full top-0 translate-x-[10px]',
    right: 'left-full top-0 -translate-x-[10px]',
};

export default function Menu({
    buttonContent,
    menuItems,
    menuPosition = 'bottom',
    isOpen: controlledIsOpen,
    onOpenChange,
    customButton,
    style
}) {
    if(style && typeof style !== 'object') {
        style = {};
    }

    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isControlled = controlledIsOpen !== undefined;
    const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
    const toggleMenu = () => {

        if (isControlled) {

            onOpenChange && onOpenChange(!controlledIsOpen);

        } else {

            setInternalIsOpen(prev => !prev);

        }

    };

    const containerRef = useRef(null);

    useEffect(() => {

        const handleClickOutside = (event) => {

            if (containerRef.current && !containerRef.current.contains(event.target)) {

                if (isControlled) {

                    onOpenChange && onOpenChange(false);

                } else {

                    setInternalIsOpen(false);

                }

            }

        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => document.removeEventListener('mousedown', handleClickOutside);

    }, [isControlled, onOpenChange]);

    const menuPositionClass = menuPositionClasses[menuPosition] || menuPositionClasses.bottom;

    const renderButton = customButton

        ? cloneElement(customButton, {

            onClick: (e) => {

                customButton.props.onClick && customButton.props.onClick(e);

                toggleMenu();

            }

        })

        : (

            <button className='bg-[#007BFF] text-white border-none px-5 py-2.5 cursor-pointer rounded transition-colors duration-300 ease hover:bg-[#0056b3]' onClick={toggleMenu}>

                {buttonContent}

            </button>

        );

    return (

        <div className='relative inline-block w-full cursor-pointer whitespace-nowrap' ref={containerRef} style={style}>

            {renderButton}

            <div className={`absolute p-[10px] opacity-0 invisible transition-all duration-300 ease z-10 ${menuPositionClass} ${isOpen ? 'opacity-100 visible translate-x-0 translate-y-0 p-0 min-w-full w-max' : ''}`}>

                {menuItems}

            </div>

        </div>

    );

}