const FootballMatch = require('../models/footballMatch.models')
const RefereeTeam = require('../models/refereeTeam.models')
const User = require('../models/user.models')
const Team = require('../models/team.models')
const RefereeStats = require('../models/refereeStats.models')


const getAllFootballMatchs = async (req, res) => {
    try {
        const footballMatchs = await FootballMatch.findAll({
            where: req.query,
            attributes: {
                exclude: ['played', 'goals_away', 'goals_local', 'red_card_local', 'red_card_away', 'yellow_card', 'penalties', 'refereeTeamId',"referee_score"]
            },
            include : {
                model : Team,
                through: {
                    attributes: []
                  }              
            }
        })
        if (footballMatchs) {
            return res.status(200).json(footballMatchs)
        } else {
            return res.status(404).send("FootballMatch not found")
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getAllFootballMatchsAllInfo = async (req, res) => {
    try {
        const footballMatchs = await FootballMatch.findAll({
            where: req.query,
            include : {
                model : Team, 
                through: {
                    attributes: []
                  }    
            }
        })
        if (footballMatchs) {
            return res.status(200).json(footballMatchs)
        } else {
            return res.status(404).send("FootballMatch not found")
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getOneFootballMatch = async (req, res) => {
    try {
        const footballMatch = await FootballMatch.findByPk(req.params.footballMatchId, {
            attributes: {
                exclude: ['played', 'goals_away', 'goals_local', 'red_card_local', 'red_card_away', 'yellow_card', 'penalties', 'refereeTeamId',"referee_score"]
            },
            include : {
                model : Team,
                through: {
                    attributes: []
                  }    
            }
        })
        if (footballMatch) {
            return res.status(200).json(footballMatch)
        } else {
            return res.status(404).send("FootballMatch not found")
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getOneFootballMatchAllInfo = async (req, res) => {
    try {
        const footballMatch = await FootballMatch.findByPk(req.params.footballMatchId,{
            include : {
                model : Team,
                through: {
                    attributes: []
                  }    
            }
        })
        if (footballMatch) {
            return res.status(200).json(footballMatch)
        } else {
            return res.status(404).send("FootballMatch not found")
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getOwnFootballMatches= async (req, res) => {
    try {
        const footballMatches = await FootballMatch.findAll({
            where: {
                refereeTeamId : res.locals.user.refereeTeamId
            },
            include : {
                model : Team,
                through: {
                    attributes: []
                  }    
            }
        })

        if (footballMatches) {
            return res.status(200).json(footballMatches)
        } else {
            return res.status(404).send("FootballMatch not found")
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}


const getNextFootballMatch = async (req,res) => {
    try {
        const footballMatches = await FootballMatch.findAll({
            where: {
                refereeTeamId : res.locals.user.refereeTeamId,
                played : false
            },
            attributes:{
                exclude : ['played', 'goals_away', 'goals_local', 'red_card_local', 'red_card_away', 'yellow_card', 'penalties',"referee_score"]
            },
            include : {
                model : Team,
                through: {
                    attributes: []
                  }    
            }
        })
        let resultArray = footballMatches.sort(function(a,b){
            return  new Date(b.date) - new Date(a.date);
          });
        if (footballMatches) {
            return res.status(200).json(resultArray[0])
        } else {
            return res.status(404).send("You don´t have any assigned Football Match")
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}




const createFootballMatch = async (req, res) => {
    try {
        const footballMatch = await FootballMatch.create(req.body)
        const refereeTeam = await RefereeTeam.findByPk(footballMatch.refereeTeamId)
        if(refereeTeam && footballMatch.played){
            var users = await refereeTeam.getUsers()
            for(let i=0;i < users.length;i++){
                let user = await User.findByPk(users[i].id)
                let stat =  await user.getReferee_stat()
                stat.goals_away_team += footballMatch.goals_away
                stat.goals_local_team += footballMatch.goals_local
                stat.yellow_card += footballMatch.yellow_card
                stat.red_card += footballMatch.red_card_local + footballMatch.red_card_away
                stat.penalties += footballMatch.penalties
                stat.referee_score = (stat.referee_score + footballMatch.referee_score )/2
                await stat.save()   }
        }
        const team_local = await Team.findByPk(req.body.team_local)
        const team_away = await Team.findByPk(req.body.team_away)
        await footballMatch.addTeams(team_local)
        await footballMatch.addTeams(team_away)

        if(footballMatch.played){
        team_local.sending_off = footballMatch.red_card_local 
        team_away.sending_off = footballMatch.red_card_away

        await team_local.save()
        await team_away.save()
    }
        if (footballMatch) {
            return res.status(200).json(footballMatch)
        } else {
            return res.status(404).send("FootballMatch not created")
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const updateFootballMatch = async (req, res) => {
    try {
        const footballMatch = await FootballMatch.update(req.body, {
            where: {
                id: req.params.footballMatchId
            }
        })
        if (footballMatch) {
            return res.status(200).json({ message: "FootballMatch updated" })
        } else {
            return res.status(404).send("FootballMatch not found")
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const deleteFootballMatch = async (req, res) => {
    try {
        const footballMatch = await FootballMatch.destroy({
            where: {
                id: req.params.footballMatchId
            }
        })
        if (footballMatch) {
            return res.status(200).json({ message: "FootballMatch deleted" })
        } else {
            return res.status(404).send("FootballMatch not found")
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}


module.exports = {
    getAllFootballMatchs,
    getAllFootballMatchsAllInfo,
    getOneFootballMatch,
    getOneFootballMatchAllInfo,
    getOwnFootballMatches,
    getNextFootballMatch,
    createFootballMatch,
    updateFootballMatch,
    deleteFootballMatch
}