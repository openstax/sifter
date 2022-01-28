import base64
import json
import os
import urllib.request
from datetime import datetime
from os.path import exists
from urllib.request import Request, urlopen

import requests
from beaker.cache import CacheManager
from beaker.util import parse_cache_config_options
from bs4 import BeautifulSoup as bs
from dotenv import load_dotenv

from book import ApprovedBook, Version, Book
from exceptions import SifterException

load_dotenv()

GITHUB_ABL_URL = os.getenv('GITHUB_ABL_URL')
GITHUB_REPO_OWNER = os.getenv('GITHUB_REPO_OWNER')
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
GITHUB_USER = os.getenv('GITHUB_USER')
GITHUB_API_URL = os.getenv('GITHUB_API_URL')

TESTED_ABL_VERSION = int(os.getenv('TESTED_ABL_VERSION'))
CACHE_OPTIONS = {
    'cache.type': os.getenv('BEAKER_CACHE_TYPE'),
    'cache.data_dir': os.getenv('BEAKER_CACHE_DATA_DIR'),
    'cache.lock_dir': os.getenv('BEAKER_LOCK_DIR')
}
CACHE_EXPIRATION = os.getenv('BEAKER_CACHE_EXPIRATION')

cache = CacheManager(**parse_cache_config_options(CACHE_OPTIONS))

SESSION = requests.Session()
SESSION.auth = (GITHUB_USER, GITHUB_TOKEN)
ENCODING = 'utf-8'


def get_api(url):
    try:
        request = Request(GITHUB_API_URL + url)
        base64string = base64.b64encode(f'{GITHUB_USER}/token:{GITHUB_TOKEN}'.encode(encoding='UTF-8'))
        request.add_header("Authorization", "Basic %s" % base64string)
        with  urlopen(request) as result:
            print(result.read())
    except Exception as e:
        print(f'Failed to get api request from {url}. \nCause: {e}')


def format_s3_url(base_path=None, pipeline_version=None, uuid=None):
    return f"{base_path}/archives/{pipeline_version}/contents/{uuid}.json"


def load_github_approved_books():
    path = 'content-manager-approved-books/{}.json'.format(datetime.today().strftime('%Y%m%d'))
    try:
        if exists(path):
            with open(path) as input_file:
                return json.load(input_file)
        with urllib.request.urlopen(GITHUB_ABL_URL) as url:
            data = json.loads(url.read().decode())
        with open(path, 'w', encoding='utf8') as outfile:
            json.dump(data, outfile, ensure_ascii=False)
        return data
    except:
        print("Failed to load the ABL!")


@cache.cache('abl', expire=3600)
def create_abl():
    try:
        abl_json = load_github_approved_books()
        abl = []
        if abl_json is None:
            abl_json = {}
        if abl_json['api_version'] == TESTED_ABL_VERSION:
            for ab in abl_json['approved_books']:
                if 'repository_name' in ab:
                    abl.append(ApprovedBook.from_github(repository_name=ab['repository_name'],
                                                        platforms=[x for x in ab['platforms']],
                                                        versions=[Version(min_code_version=x['min_code_version'],
                                                                          edition=x['edition'],
                                                                          commit_sha=x['commit_sha'],
                                                                          commited_at=x['commit_metadata'][
                                                                              'committed_at'],
                                                                          books=[Book(uuid=y['uuid'], style=y['style'],
                                                                                      slug=y['slug']) for y in
                                                                                 x['commit_metadata']['books']]) for x
                                                                  in
                                                                  ab['versions']]))
                elif 'collection_id' in ab:
                    abl.append(ApprovedBook.from_legacy(collection_id=ab['collection_id'], server=ab['server'],
                                                        tutor_only=ab['tutor_only'],
                                                        books=[Book(uuid=y['uuid'], slug=y['slug'], style=ab['style'])
                                                               for y
                                                               in ab['books']]))
            return abl
        else:
            raise SifterException(f"The ABL API version {abl_json['api_version']} is not supported")
    except Exception as ex:
        raise ex


@cache.cache('load_canonicals', expires=CACHE_EXPIRATION)
def load_canonicals(repository_name=None):
    return json.loads(SESSION.get(
        f'https://raw.githubusercontent.com/{GITHUB_REPO_OWNER}/{repository_name}/main/canonical.json').content
                      .decode(ENCODING))


@cache.cache('load_modules', expires=CACHE_EXPIRATION)
def load_modules(repository_name=None, canonicals=[]):
    for x in canonicals:
        collection = bs(SESSION.get(
            f'https://raw.githubusercontent.com/{GITHUB_REPO_OWNER}/{repository_name}/main/collections/{x}.collection.xml').content.decode(
            ENCODING), 'xml')
    return set([module.get('document') for module in collection.find_all("module")])


def find_cnxml_files(book: ApprovedBook = None):
    if not book.legacy:
        # Download the canonical of the book
        canonicals = load_canonicals(repository_name=book.repository_name)

        modules = load_modules(repository_name=book.repository_name, canonicals=canonicals)
        cnxmls = set([
            f'https://raw.githubusercontent.com/{GITHUB_REPO_OWNER}/{book.repository_name}/main/modules/{m}/index.cnxml'
            for m in modules])
        print(cnxmls)
        # Find the modules numbers

        # print(get_api(f'/repos/{GITHUB_REPO_OWNER}/osbooks-writing-guide/contents/modules/m00001/index.cnxml'))
        # base64string = base64.b64encode(f'{GITHUB_USER}/token:{GITHUB_TOKEN}'.encode(encoding='UTF-8'))
        # url = f'https://api.github.com/repos/{GITHUB_REPO_OWNER}/osbooks-writing-guide/contents/modules/m00001/index.cnxml&ref=main'
        # print(
        #     requests.get(url, headers={'Accept': 'application/vnd.github.v3.raw',
        #                                'Authorization': f'Basic {base64string}'}).text)

        # providing raw url to download csv from github
        csv_url = f'https://raw.githubusercontent.com/{GITHUB_REPO_OWNER}/osbooks-writing-guide/main/modules/m00001/index.cnxml'

        download = SESSION.get(csv_url).content
        # print(download.decode(ENCODING))
    else:
        pass


def list_books_cnxml_files(repository_name=None):
    query_url = f"https://api.github.com/repos/{GITHUB_REPO_OWNER}/{repository_name}/"


if __name__ == '__main__':
    # get_api(f'/orgs/{GITHUB_REPO_OWNER}/repos')
    # print(create_abl())
    ab = ApprovedBook()
    ab.legacy = False
    ab.repository_name = 'osbooks-college-algebra-bundle'
    find_cnxml_files(book=ab)
