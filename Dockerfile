FROM php:8.3-apache

RUN a2enmod rewrite headers \
 && echo "ServerName localhost" >> /etc/apache2/apache2.conf

COPY index.html danke.html fehler.html datenschutz.html senden.php smtp.php /var/www/html/
COPY css /var/www/html/css
COPY js /var/www/html/js
COPY assets /var/www/html/assets

RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
