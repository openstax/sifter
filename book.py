class ApprovedBook:
    def __init__(self, legacy=False):
        self.legacy = legacy

    @classmethod
    def from_github(cls, repository_name=None, platforms=[], versions=[]):
        ab = cls()
        ab.repository_name = repository_name
        ab.platforms = platforms
        ab.versions = versions
        return ab

    @classmethod
    def from_legacy(cls, collection_id=None, server=None, tutor_only=False, books=[]):
        ab = cls(legacy=True)
        ab.collection_id = collection_id
        ab.server = server
        ab.books = books
        ab.tutor_only = tutor_only
        return ab


class Book:
    def __init__(self, uuid=None, slug=None, style=None):
        self.uuid = uuid
        self.slug = slug,
        self.style = style


class Version:
    def __init__(self, min_code_version=None, commit_sha=None, edition=1, commited_at=None, books=[]):
        self.min_code_version = min_code_version
        self.commit_sha = commit_sha
        self.edition = edition
        self.commit_metadata = {commited_at: commited_at, tuple(books): books}
