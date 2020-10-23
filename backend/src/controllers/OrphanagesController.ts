import{Request, Response} from 'express';
import {getRepository} from 'typeorm';
import Orphanage from '../models/Orphanage';
import orphanageView from '../views/orphanages_view';
import * as Yup from 'yup';

export default{

  async index(req: Request, resp: Response){
    const orphanageRepository = getRepository(Orphanage);
    const orphanages = await orphanageRepository.find({
      relations:[
        'images'
      ]
    });
    return resp.json(orphanageView.renderMany(orphanages));
  },

  async show(req: Request, resp: Response){
    const {id} = req.params;
    const orphanageRepository = getRepository(Orphanage);
    const orphanage = await orphanageRepository.findOneOrFail(id, {
      relations:['images']
    });
    return resp.json(orphanageView.render(orphanage));
  },

  async create(req: Request, resp:Response){
    console.log(req.files)
    const {
      name, 
      latitude, 
      longitude, 
      about, 
      instructions, 
      opening_hours, 
      open_on_weekends,     
    } = req.body;
   
    const orphanageRepository= getRepository(Orphanage);

    const requestImages = req.files as Express.Multer.File[];   

    const images = requestImages.map(image =>{
      return {path:image.filename}
    })
   
    const data= {
      name, 
      latitude, 
      longitude, 
      about, 
      instructions, 
      opening_hours, 
      open_on_weekends: open_on_weekends === 'true',
      images
    };

    const schema = Yup.object().shape({
      name:Yup.string().required(),
      latitude:Yup.number().required(),
      longitude:Yup.number().required(),
      about: Yup.string().required().max(300),
      instructions:Yup.string().required(),
      opening_hours:Yup.string().required(),
      open_on_weekends:Yup.boolean().required(),
      images:Yup.array(
        Yup.object().shape({
          path:Yup.string().required()
        })
      )
    });

    const finalData = schema.cast(data);

    await schema.validate(finalData, {
      abortEarly:false,
    })

    const newOrphanage = orphanageRepository.create(data);
    
     await orphanageRepository.save(newOrphanage)
   
     return resp.status(201).json(newOrphanage)
  }
};