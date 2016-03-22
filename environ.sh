#!/bin/bash          
echo Transient Enviromental Variables
# Used primarily for testing
# These can be set via AWS/Elastic Beanstalk in config
#
# export VARIABLE=value
# export PATH=$HOME/bin/perl:$PATH
#
# VARS REQUIRED FOR SERVICE
# -------------------------
# SHAREDSECRET - 
# DBCONN - postgres://[USERNAME]:[PASSWORD]@[HOST]:[PORT]/[DB]  
# PORT 8081  
# LOADIO 
echo Setting Transient Enviromental Variables
export PORT=8081
export DBCONN=postgres://gene@localhost:5432/gene
# 608169da637a58ac0bff23895b58f8de5ef982a5a30f5477e2fdea27c5bdef8d5b0b13bfc8c2c77c
export SHAREDSECRET=608169da637a58ac0bff23895b58f8de5ef982a5a30f5477e2fdea27c5bdef8d5b0b13bfc8c2c77c
export LOADIO=loadio
# createdb -p 5432 -U WYLDMESH -W X1ICBM690 WYLDLU
echo PORT: $PORT
echo DBCONN: $DBCONN
echo SHAREDSECRET: $SHAREDSECRET 
echo LOADIO: $LOADIO
#
#
#CREATE TABLE status (
#    statusId				         integer NOT NULL, 
#    lineId           			     varchar(80),   -- description
#    statusSeverityDescription       varchar(80),   -- "Good Service"
#    statusSeverity        	         integer,           -- 10
#    reason                          varchar(1024),
#    created         			     timestamp,      -- without timezone "2016-03-03T11:04:59.517"
#    archive         			     boolean,       -- check if pending delete
#    CONSTRAINT statusId_pk PRIMARY KEY (statusId)
#);
#
#
#
#
#CREATE TABLE disruption (
#    disruptionId  integer NOT NULL,
#    type            varchar(80),   -- "routeInfo"
#    description     varchar(1024), -- description
#    created         timestamp,    	-- "2015-12-01T11:29:00"
#    lastUpdate    timestamp,  	-- "2015-12-01T11:29:00"
#    archive         boolean,       -- check if pending delete
#    CONSTRAINT disruptionId_pk PRIMARY KEY (disruptionId)
#);
#
#
#[{"$type":"Tfl.Api.Presentation.Entities.Disruption, Tfl.Api.Presentation.Entities",
#"category":"Undefined",
#"type":"routeInfo",
#"categoryDescription":"Undefined",
#"description":"HEATHROW CONNECT: Please note that Oyster Cards, Freedom Passes and Travelcards are not valid on Heathrow Connect services between Hayes & Harlington and Heathrow.",
#"created":"2015-12-01T11:29:00",
#"lastUpdate":"2015-12-01T11:29:00",
#"affectedRoutes":[],
#"affectedStops":[]},
#
#