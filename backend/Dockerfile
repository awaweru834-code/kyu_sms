FROM php:8.2-apache

# Install PDO and MySQL extensions required for database communication
RUN docker-php-ext-install pdo pdo_mysql

# Enable Apache headers and rewrite modules
RUN a2enmod headers rewrite

# Copy backend files into Apache's public web root
COPY . /var/www/html/

# Ensure Apache has read permissions
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80