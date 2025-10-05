import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  CreditCard, 
  BarChart3, 
  User, 
  X,
  Lock
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, canEdit } = useAuth();
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      accessible: true
    },
    {
      name: 'Transactions',
      href: '/transactions',
      icon: CreditCard,
      accessible: true,
      requiresEdit: true
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      accessible: true
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      accessible: true
    }
  ];

  const filteredNavigation = navigation.filter(item => {
    if (!item.accessible) return false;
    if (item.requiresEdit && !canEdit()) return false;
    return true;
  });

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary border-r border-border-color transform transition-transform duration-300 ease-in-out lg:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-border-color">
          <h2 className="text-lg font-semibold text-primary">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-secondary hover:text-primary hover:bg-secondary transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-4">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-accent text-white'
                    : 'text-secondary hover:text-primary hover:bg-secondary'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
                {item.requiresEdit && !canEdit() && (
                  <Lock className="w-4 h-4 ml-auto" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border-color">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">
                {user?.firstName || user?.username}
              </p>
              <p className="text-xs text-muted capitalize">
                {user?.role} user
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-64 lg:bg-primary lg:border-r lg:border-border-color">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 p-4 border-b border-border-color">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-primary">Finance Tracker</h2>
          </div>

          {/* Navigation */}
          <nav className="flex-1 mt-4">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-accent text-white'
                      : 'text-secondary hover:text-primary hover:bg-secondary'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                  {item.requiresEdit && !canEdit() && (
                    <Lock className="w-4 h-4 ml-auto" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* User info at bottom */}
          <div className="p-4 border-t border-border-color">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary">
                  {user?.firstName || user?.username}
                </p>
                <p className="text-xs text-muted capitalize">
                  {user?.role} user
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
