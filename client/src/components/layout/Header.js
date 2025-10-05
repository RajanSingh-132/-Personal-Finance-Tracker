import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Menu, 
  Sun, 
  Moon, 
  Bell, 
  User, 
  LogOut,
  Settings
} from 'lucide-react';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-primary border-b border-border-color shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Left side - Mobile menu button */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-secondary hover:text-primary hover:bg-secondary transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* App title */}
          <h1 className="text-xl font-bold text-primary">
            Finance Tracker
          </h1>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-secondary hover:text-primary hover:bg-secondary transition"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {/* Notifications */}
          <button
            className="p-2 rounded-md text-secondary hover:text-primary hover:bg-secondary transition relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full text-xs flex items-center justify-center text-white">
              3
            </span>
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 rounded-md text-secondary hover:text-primary hover:bg-secondary transition"
            >
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="hidden sm:block text-sm font-medium">
                {user?.firstName || user?.username}
              </span>
            </button>

            {/* User dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-primary rounded-md shadow-lg border border-border-color z-50">
                <div className="py-1">
                  {/* User info */}
                  <div className="px-4 py-2 border-b border-border-color">
                    <p className="text-sm font-medium text-primary">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-secondary">
                      {user?.email}
                    </p>
                    <p className="text-xs text-muted capitalize">
                      {user?.role} user
                    </p>
                  </div>

                  {/* Menu items */}
                  <a
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-secondary hover:text-primary hover:bg-secondary transition"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Profile Settings
                  </a>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-secondary hover:text-primary hover:bg-secondary transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
};

export default Header;
