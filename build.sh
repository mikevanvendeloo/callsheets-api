docker build -f Dockerfile -t mvanvendeloo/callsheets-api:v1.3 .

#docker run -it --rm --env-file=./.env --name callsheets-online -p 0.0.0.0:8000:8000 mvanvendeloo/callsheets-online

docker push mvanvendeloo/callsheets-api:v1.3