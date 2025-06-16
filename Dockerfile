# Use PHP + Apache base image
FROM php:8.2-apache

# Enable Apache mod_rewrite (optional, if you're doing clean URLs)
RUN a2enmod rewrite

# Set working directory to default Apache web root
WORKDIR /var/www/html

# Copy all files into Apache's public folder
COPY . /var/www/html/

# Set proper file permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

RUN apt-get update && apt-get install -y libpq-dev \ 
    && docker-php-ext-install pdo pdo_pgsql
    
# Expose HTTP port
EXPOSE 80