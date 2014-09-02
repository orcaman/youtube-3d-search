import webapp2
import urllib2
import os
import string
import logging
import jinja2
import base64
import countries
import api
from datetime import datetime
from google.appengine.ext import ndb

jinja_environment = jinja2.Environment(
  loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
  extensions=['jinja2.ext.autoescape'],
  autoescape=True)

def is_mobile(self):
	return ('Mobile' or 'Tablet') in str(self.request.headers['User-Agent'])

class HomeHandler(webapp2.RequestHandler):
	def get(self):
		country = countries.get_region_id(self)

		country  = countries.code_to_country[country]
		og_url   = 'http://www.3dyoutube.nl/'
		og_image = 'http://www.3dyoutube.nl/static/img/fb.png'
		category = 'home'
		isMobile = 'true' if is_mobile(self) else 'false'
		video_id = ''
		template_path = 'templates/index-mobile.html' if is_mobile(self) else 'templates/index.html'

		htmlContents = jinja_environment.get_template(template_path).render(mobile=isMobile,country=country,category=category,og_url=og_url,og_image=og_image,video_id=video_id) 
		self.response.out.write(htmlContents)

class VideoHandler(webapp2.RequestHandler):
	def get(self, video_id, thumb):
		country = countries.get_region_id(self)

		country  = countries.code_to_country[country]
		og_url   = self.request.url
		og_image = base64.b64decode(thumb)
		category = 'video'
		isMobile = 'true' if is_mobile(self) else 'false'
		video_id = base64.b64decode(video_id)
		template_path = 'templates/index-mobile.html' if is_mobile(self) else 'templates/index.html'
		
		htmlContents  = jinja_environment.get_template(template_path).render(mobile=isMobile,country=country,category=category,og_url=og_url,og_image=og_image,video_id=video_id)
		self.response.out.write(htmlContents)

app = webapp2.WSGIApplication([
	('/', HomeHandler),
	('/video/(.*)/(.*)', VideoHandler),
    ('/api/(.*)', api.ApiHandler)
], debug=False)

def handle_403(request, response, exception):
    response.write('{"error" : "api key is invalid, or quota has exceeded. register your key at www.playstoreapi.com or contact@playstoreapi.com"}')
    response.set_status(403)
    
def handle_404(request, response, exception):
    logging.exception(exception)
    response.write()
    response.set_status(404)

app.error_handlers[404] = handle_404
app.error_handlers[403] = handle_403

