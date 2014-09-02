import webapp2
import urllib2
import os
import string
import logging
import jinja2
import base64
import countries
from datetime import datetime
from google.appengine.ext import ndb

_DEV_KEY = os.environ.get('youtube_dev_key')
_REFRESH_INTERVAL = int(os.environ.get('refresh_package_if_not_updated'))
_MAX_RESULTS_DEFAULT = 50

class GDataResponse(ndb.Model):
    created_on = ndb.DateTimeProperty(auto_now_add=True)
    updated_on = ndb.DateTimeProperty(auto_now_add=True)
    response = ndb.JsonProperty(indexed=False)
    api_key = ndb.StringProperty(indexed=False)
    url = ndb.StringProperty(indexed=True)

class ApiHandler(webapp2.RequestHandler):
	def get_url(self, method, time, max_results, query):
		if (len(time) == 0):
			time = 'today'
		if (len(max_results) == 0):
			max_results = _MAX_RESULTS_DEFAULT
		if (method == 'most_popular'):
			region_id = countries.get_region_id(self)
			base_url = 'http://gdata.youtube.com/feeds/api/standardfeeds/{0}/most_popular?alt=json&v=2&key={1}&time={2}&max-results={3}'
			url = base_url.format(region_id, _DEV_KEY, time, max_results)
			return url
		if (method == 'search'):
			base_url = 'http://gdata.youtube.com/feeds/api/videos?alt=json&v=2&key={0}&max-results={1}&q={2}'
			url = base_url.format(_DEV_KEY, max_results, urllib2.quote(query.encode("utf-8")))
			return url

	def get_data_from_api(self, url):
		request = urllib2.Request(url, headers={'X-GData-Key': 'key=%s' % _DEV_KEY})
		contents = urllib2.urlopen(request).read()
		return contents
	def get(self, method):
		query = self.request.get('q')
		if (len(query) == 0):
			method = 'most_popular'
		url = self.get_url(method, self.request.get('t'), self.request.get('m'), query)
		data = GDataResponse.get_or_insert(url)
		if (data is None or data.response is None):
			data.api_key = _DEV_KEY
			data.created_on = datetime.now()
			data.updated_on = datetime.now()
			data.url = url
			data.response = self.get_data_from_api(url)
			data.put()
		else:
			dayDiff = datetime.now() - data.updated_on
			if (dayDiff.days >= _REFRESH_INTERVAL):
				data.updated_on  = datetime.now()
				data.response = self.get_data_from_api(url)
				data.put()
		self.response.headers['Access-Control-Allow-Origin'] = '*';
		self.response.headers['Content-Type'] = 'application/json'   
		self.response.out.write(data.response)