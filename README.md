# Digimium - Digital Subscription Management System

A comprehensive digital subscription management platform that includes a customer-facing website, admin dashboard, and Telegram bot for managing digital service subscriptions.

## 🏗️ Project Structure

### 📁 `digimium.store/` - Customer Website

**Main customer-facing website for purchasing digital subscriptions**

**Functionality:**

- **Product Catalog Display**: Showcases available digital subscriptions (Netflix, Spotify, YouTube Premium, Disney+, HBO, ChatGPT, etc.)
- **SEO Optimized**: Complete meta tags, structured data, hreflang tags for multilingual support (English & Burmese)
- **Responsive Design**: Mobile-optimized interface with modern UI/UX
- **Payment Integration**: Customer checkout and payment processing
- **Service Delivery**: Automated delivery of subscription credentials
- **Analytics Integration**: Google Analytics and Search Console setup

**Key Features:**

- Multi-language support (English/Myanmar)
- Social media integration (Open Graph, Twitter Cards)
- Performance optimized with preconnect links
- Accessibility compliant with ARIA labels

---

### 📁 `admin.digimium.store/` - Admin Dashboard

**Comprehensive admin panel for managing sales, products, and users**

**Functionality:**

#### 🔐 **Authentication System**

- **Role-based Access Control**: Admin, Staff, Owner roles with different permissions
- **Session Management**: Secure login/logout with remember me functionality
- **Password Security**: Encrypted password handling with toggle visibility

#### 📊 **Sales Management**

- **Sales Overview**: Real-time dashboard showing retail and wholesale sales
- **Add Sales**: Manual entry of customer sales with product selection
- **Search & Filter**: Customer search functionality with real-time filtering
- **Data Export**: CSV download for sales reports (Admin/Owner only)
- **Bulk Import**: CSV upload for bulk sales data entry

#### 🛍️ **Product Catalog Management**

- **Product CRUD**: Create, read, update, delete products
- **Pricing Management**: Set retail and wholesale prices
- **Duration Settings**: Configure subscription durations (1, 2, 3, 6, 12 months)
- **Renewal Options**: Set monthly renewable requirements
- **Category Management**: Organize products by service type

#### 👥 **User Management**

- **User List**: View and manage admin panel users (Owner only)
- **Role Assignment**: Assign different permission levels
- **User Activity**: Track user actions and access logs

#### 📈 **Analytics & Reporting**

- **Summary Reports**: Comprehensive sales analytics and insights
- **Performance Metrics**: Revenue tracking and growth analysis
- **Data Visualization**: Charts and graphs for business intelligence

**Technical Features:**

- **Responsive Design**: Mobile-friendly admin interface
- **Real-time Updates**: Live data refresh without page reload
- **Data Validation**: Client and server-side form validation
- **Error Handling**: Comprehensive error management and user feedback

---

### 📁 `digimium-bot/` - Telegram Bot

**Automated Telegram bot for customer service and order management**

**Functionality:**

#### 🤖 **Bot Commands**

- **Start Command**: Welcome message and bot introduction
- **Help Command**: List of available commands and features
- **Menu System**: Interactive inline keyboard navigation

#### 📋 **Order Management**

- **Order Tracking**: Real-time order status updates
- **Order History**: Customer order history and details
- **Order Notifications**: Automated order completion alerts

#### 💬 **Customer Support**

- **Live Chat**: Direct communication with customers
- **FAQ System**: Automated responses to common questions
- **Support Tickets**: Create and track support requests

#### 📊 **Admin Features**

- **Sales Reports**: Daily, weekly, monthly sales summaries
- **Customer Analytics**: Customer behavior and preferences
- **Inventory Alerts**: Low stock notifications
- **Performance Monitoring**: Bot usage statistics

#### 🔄 **Database Integration**

- **MySQL Connection**: Pooled database connections for performance
- **Real-time Sync**: Live synchronization with admin dashboard
- **Data Backup**: Automated data backup and recovery
- **Timezone Handling**: Bangkok timezone support for accurate timestamps

**Technical Features:**

- **Async Operations**: Non-blocking concurrent operations
- **Error Recovery**: Automatic reconnection and error handling
- **Message Formatting**: Rich text and markdown support
- **Rate Limiting**: API call optimization and throttling

---

### 📁 `database backup/` - Database Backups

**Automated database backup storage**

**Functionality:**

- **Regular Backups**: Automated daily/weekly database snapshots
- **Multiple Tables**: Separate backups for different data types
- **Version Control**: Historical backup retention
- **Recovery Support**: Quick database restoration capabilities

**Backup Files:**

- `digimium_panel_products_catalog.sql` - Product catalog data
- `digimium_panel_sale_overview.sql` - Sales transaction data
- `digimium_panel_bot_users.sql` - Telegram bot user data
- `digimium_panel_users.sql` - Admin panel user data
- `digimium_panel_ws_products_catalog.sql` - Wholesale product data
- `digimium_panel_ws_sale_overview.sql` - Wholesale sales data

---

## 🔧 Technical Stack

### Frontend

- **HTML5/CSS3**: Modern responsive design
- **JavaScript**: Interactive functionality and AJAX calls
- **Bootstrap**: UI framework for consistent styling

### Backend

- **PHP**: Server-side logic and API endpoints
- **MySQL**: Relational database management
- **Python**: Telegram bot automation

### Infrastructure

- **Web Server**: Apache with .htaccess configuration
- **SSL/TLS**: Secure HTTPS connections
- **CDN**: Content delivery network optimization

---

## 🚀 Key Features

### 🔒 **Security**

- Role-based access control
- Session management
- SQL injection prevention
- XSS protection
- CSRF token validation

### 📱 **Mobile Optimization**

- Responsive design
- Touch-friendly interface
- Mobile-specific optimizations
- Progressive Web App features

### 🔄 **Automation**

- Automated order processing
- Real-time notifications
- Scheduled backups
- Performance monitoring

### 📊 **Analytics**

- Sales tracking
- Customer analytics
- Performance metrics
- SEO monitoring

---

## 🎯 Business Value

This system provides a complete digital subscription management solution with:

- **Customer Acquisition**: SEO-optimized website for organic traffic
- **Sales Management**: Comprehensive admin tools for business operations
- **Customer Service**: Automated bot support for 24/7 assistance
- **Data Security**: Secure handling of sensitive customer and business data
- **Scalability**: Modular architecture for easy expansion and maintenance
