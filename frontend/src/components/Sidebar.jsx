import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { getUser } from '../utils/api';
import { 
    HiOutlineChartBar, 
    HiOutlineClipboardDocumentList, 
    HiOutlineUserGroup, 
    HiOutlineCog6Tooth,
    HiOutlineSun,
    HiOutlineMoon,
    HiOutlineArrowRightOnRectangle,
    HiOutlineHome,
    HiOutlineBars3,
    HiOutlineXMark
} from 'react-icons/hi2';

const Sidebar = ({ theme, onToggleTheme, isCollapsed, onToggleCollapse }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = getUser();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('demoMode');
        navigate('/login-register');
    };

    const menuItems = [
        { path: '/admin/dashboard', label: 'Dashboard', icon: HiOutlineChartBar },
        { path: '/admin/reports', label: 'Reports', icon: HiOutlineClipboardDocumentList },
    ];

    // Add admin-only items
    if (user?.role === 'admin') {
        menuItems.push(
            { path: '/admin/users', label: 'Users', icon: HiOutlineUserGroup, divider: true },
            { path: '/admin/settings', label: 'Settings', icon: HiOutlineCog6Tooth }
        );
    }

    return (
        <div className={`h-screen fixed left-0 top-0 flex flex-col transition-all duration-300 shadow-xl z-50 ${
            isCollapsed ? 'w-20' : 'w-72'
        } ${
            theme === 'dark' 
                ? 'bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 border-r border-gray-800' 
                : 'bg-gradient-to-b from-white via-gray-50 to-gray-100 border-r border-gray-200'
        }`}>
            {/* Logo Section */}
            <div className={`p-4 border-b transition-colors ${
                theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
            }`}>
                <div className="flex items-center justify-between mb-4">
                    {!isCollapsed && (
                        <div className="flex items-center space-x-3 flex-1">
                            <div className={`p-2 rounded-xl ${
                                theme === 'dark' 
                                    ? 'bg-amber-500/20 text-amber-400' 
                                    : 'bg-amber-100 text-amber-600'
                            }`}>
                                <HiOutlineHome className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className={`text-xl font-bold ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                    WubLand
                                </h1>
                                <p className={`text-xs font-medium ${
                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                                }`}>
                                    Admin Panel
                                </p>
                            </div>
                        </div>
                    )}
                    {isCollapsed && (
                        <div className="flex justify-center w-full">
                            <div className={`p-2 rounded-xl ${
                                theme === 'dark' 
                                    ? 'bg-amber-500/20 text-amber-400' 
                                    : 'bg-amber-100 text-amber-600'
                            }`}>
                                <HiOutlineHome className="w-6 h-6" />
                            </div>
                        </div>
                    )}
                    <button
                        onClick={onToggleCollapse}
                        className={`p-2 rounded-lg transition-colors ${
                            theme === 'dark'
                                ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                                : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                        }`}
                        aria-label="Toggle sidebar"
                    >
                        {isCollapsed ? (
                            <HiOutlineBars3 className="w-5 h-5" />
                        ) : (
                            <HiOutlineXMark className="w-5 h-5" />
                        )}
                    </button>
                </div>
                {!isCollapsed && user && (
                    <div className={`px-3 py-2 rounded-lg ${
                        theme === 'dark' 
                            ? 'bg-gray-800/50 border border-gray-700' 
                            : 'bg-gray-100 border border-gray-200'
                    }`}>
                        <p className={`text-xs font-medium uppercase tracking-wider ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            {user.role}
                        </p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-1">
                    {menuItems.map((item, index) => {
                        const IconComponent = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <li key={index}>
                                {item.divider && (
                                    <div className={`h-px my-3 mx-2 ${
                                        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                                    }`} />
                                )}
                                <NavLink
                                    to={item.path}
                                    className={`
                                        group flex items-center ${isCollapsed ? 'justify-center' : ''} space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                                        ${isActive 
                                            ? theme === 'dark'
                                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                                                : 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                                            : theme === 'dark'
                                                ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                                : 'text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-md'
                                        }
                                    `}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <IconComponent className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                                        isActive ? 'scale-110' : 'group-hover:scale-110'
                                    }`} />
                                    {!isCollapsed && (
                                        <>
                                            <span className="font-medium">{item.label}</span>
                                            {isActive && (
                                                <div className="ml-auto w-2 h-2 rounded-full bg-white/30"></div>
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer Actions */}
            <div className={`p-4 border-t space-y-2 ${
                theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
            }`}>
                <button
                    onClick={onToggleTheme}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-3 rounded-xl transition-all duration-200 group ${
                        theme === 'dark'
                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                    title={isCollapsed ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : undefined}
                >
                    <div className="flex items-center space-x-3">
                        {theme === 'dark' ? (
                            <HiOutlineSun className="w-5 h-5 transition-transform group-hover:rotate-180 duration-500" />
                        ) : (
                            <HiOutlineMoon className="w-5 h-5 transition-transform group-hover:-rotate-12 duration-300" />
                        )}
                        {!isCollapsed && (
                            <span className="font-medium">
                                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                            </span>
                        )}
                    </div>
                </button>
                
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-3 rounded-xl transition-all duration-200 group ${
                        theme === 'dark'
                            ? 'bg-red-900/30 text-red-400 border border-red-800/50 hover:bg-red-900/50 hover:text-red-300'
                            : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:text-red-700'
                    }`}
                    title={isCollapsed ? 'Logout' : undefined}
                >
                    <div className="flex items-center space-x-3">
                        <HiOutlineArrowRightOnRectangle className="w-5 h-5 transition-transform group-hover:translate-x-1 duration-200" />
                        {!isCollapsed && (
                            <span className="font-medium">Logout</span>
                        )}
                    </div>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
