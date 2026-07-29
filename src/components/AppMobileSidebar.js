import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiX, FiMenu } from 'react-icons/fi';
import MyTreasureBrand from './MyTreasureBrand';
import FinanceHubNavButton from './FinanceHubNavButton';

/**
 * Shared mobile drawer (Chit Fund–style) for app module menus.
 */
export const AppMobileSidebar = ({
  isOpen,
  onClose,
  brandTo,
  brandSubtitle,
  items = [],
  isItemActive,
  icons = {},
  DefaultIcon,
}) => {
  const location = useLocation();

  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const activeCheck = (item) => {
    if (typeof isItemActive === 'function') return isItemActive(item);
    const current = location.pathname || '';
    const itemPath = String(item.path || '').split('?')[0].split('#')[0];
    if (current === itemPath) return true;
    return current.startsWith(`${itemPath}/`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="App menu">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 border-0 cursor-pointer"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 left-0 w-[min(20rem,88vw)] bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-200">
          <MyTreasureBrand to={brandTo} subtitle={brandSubtitle} onClick={onClose} />
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            aria-label="Close"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            <li>
              <FinanceHubNavButton
                onClick={onClose}
                className="flex w-full items-center gap-3 px-3 py-3 text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg"
                iconClassName="w-5 h-5"
              />
            </li>
            {items.map((item) => {
              const Icon = (icons && icons[item.id]) || item.Icon || DefaultIcon;
              const active = activeCheck(item);
              const IconComp = typeof Icon === 'function' ? Icon : null;
              return (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    onClick={() => {
                      if (typeof item.onNavigate === 'function') item.onNavigate();
                      onClose?.();
                    }}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-red-50 text-red-800 border border-red-100'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    {IconComp ? <IconComp className="w-5 h-5 shrink-0" aria-hidden /> : null}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
};

/** Burger button for the red app navbar (Chit Fund style). */
export const AppNavbarBurgerButton = ({
  brandTo,
  brandSubtitle,
  items = [],
  isItemActive,
  icons = {},
  DefaultIcon,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-white hover:text-red-100 hover:bg-white/10 transition-all"
        aria-label="Open main menu"
        aria-controls="mobile-menu"
        aria-expanded={open}
      >
        <FiMenu className="block h-6 w-6" />
      </button>
      <AppMobileSidebar
        isOpen={open}
        onClose={() => setOpen(false)}
        brandTo={brandTo}
        brandSubtitle={brandSubtitle}
        items={items}
        isItemActive={isItemActive}
        icons={icons}
        DefaultIcon={DefaultIcon}
      />
    </>
  );
};

export default AppMobileSidebar;
